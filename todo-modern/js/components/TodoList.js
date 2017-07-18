/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only.  Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import MarkAllTodosMutation from '../mutations/MarkAllTodosMutation';
import Todo from './Todo';

import React from 'react';
import {
  createFragmentContainer,
  createPaginationContainer,
  graphql,
} from 'react-relay';

class TodoList extends React.Component {
  _handleMarkAllChange = (e) => {
    const complete = e.target.checked;
    MarkAllTodosMutation.commit(
      this.props.relay.environment,
      complete,
      this.props.viewer.todos,
      this.props.viewer,
    );
  };
  renderTodos() {
    return this.props.viewer.todos.edges.map(edge =>
      <Todo
        key={edge.node.id}
        todo={edge.node}
        viewer={this.props.viewer}
      />
    );
  }
  render() {
    const numTodos = this.props.viewer.totalCount;
    const numCompletedTodos = this.props.viewer.completedCount;
    return (
      <section className="main">
        <button
          onClick={() => this._loadMore()}
          title="Load More"
          style={{
            height:100,
            width:100,
            backgroundColor:'blue',
          }}
        />

        <input
          checked={numTodos === numCompletedTodos}
          className="toggle-all"
          onChange={this._handleMarkAllChange}
          type="checkbox"
        />
        <label htmlFor="toggle-all">
          Mark all as complete
        </label>
        <ul className="todo-list">
          {this.renderTodos()}
        </ul>
      </section>
    );
  }
  _loadMore() {
    // debugger;
    if (!this.props.relay.hasMore() || this.props.relay.isLoading()) {
      return;
    }

    this.props.relay.loadMore(
      1, // Fetch the next 10 feed items
      e => {
        console.log(e);
      },
    );
  }
}

export default createPaginationContainer(
  TodoList,
  {
    viewer: graphql`
      fragment TodoList_viewer on User {
        todos(
          first: $count # 2147483647  # max GraphQLInt
          after: $cursor
        ) @connection(key: "TodoList_todos") {
          edges {
            node {
              id,
              complete,
              ...Todo_todo,
            },
          },
          pageInfo{
            endCursor
            hasNextPage
          }
        },
        id,
        totalCount,
        completedCount,
        ...Todo_viewer,
      }
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      // we pass a reference to the connection, which will provide information
      // about `pageInfo` to know if there're more items to be loaded.
      return props.viewer && props.viewer.todos;
    },
    getFragmentVariables(prevVars, totalCount) {
      // the variables for the local query.
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, {count, cursor}, fragmentVariables) {
      // the variables for the remote query.
      return {
        count,
        cursor,
        // in most cases, for variables other than connection filters like
        // `first`, `after`, etc. you may want to use the previous values.
        // orderBy: fragmentVariables.orderBy,
      };
    },
    query: graphql`
      query TodoListPaginationQuery(
        $count: Int!
        $cursor: String
        # $orderby: String!
      ) {
        viewer {
          # You could reference the fragment defined previously.
          ...TodoList_viewer
        }
      }
    `
  }
);
